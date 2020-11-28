package network

import (
	"errors"
	"net"
	"testing"
	"time"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
	"github.com/percybolmer/workflow/metric"
	"github.com/percybolmer/workflow/property"
	"github.com/percybolmer/workflow/pubsub"
)

func TestNetworkInterfaceHandle(t *testing.T) {
	rfg := NewNetworkInterfaceHandler()
	nethand := rfg.(*NetworkInterface)
	nethand.SetMetricProvider(metric.NewPrometheusProvider(), "test_sniff")

	nethand.Cfg.SetProperty("interface", "lo")
	worked, err := rfg.ValidateConfiguration()

	if !worked {
		t.Fatal("Failed to validate settings: ", err)
	}

	go func() {
		err := nethand.Handle(nil, nil, "test_sniff")
		if err != nil {
			t.Fatal(err)
		}
	}()
	time.Sleep(1 * time.Second)
	// Send a spoof packet on 127.0.0.1
	sendSpoofPacket("lo", t)
	time.Sleep(1 * time.Second)
	// See metrics is set
	outmet := nethand.metrics.GetMetric(nethand.MetricPayloadOut)
	if outmet == nil {
		t.Fatal("Failed to sniff packet")
	} else if outmet.Value == 0 {
		t.Fatal("No packets found")
	}
	// See topic has received item
	topic, suberr := pubsub.Subscribe("test_sniff", 1, 10)
	if suberr != nil {
		t.Fatal(suberr)
	}
	pubsub.DrainTopicsBuffer()
	if len(topic.Flow) != 1 {
		t.Fatal("Didnt find anything on the topic")
	}
}

func sendSpoofPacket(device string, t *testing.T) {
	handle, err := pcap.OpenLive(device, 65536, true, pcap.BlockForever)
	if err != nil {
		t.Fatal(err)
	}
	message := []byte("hello world")
	ipLayer := &layers.IPv4{
		SrcIP: net.IP{127, 0, 0, 1},
		DstIP: net.IP{127, 0, 0, 1},
	}
	ethernetLayer := &layers.Ethernet{
		SrcMAC: net.HardwareAddr{0xFF, 0xAA, 0xFA, 0xAA, 0xFF, 0xAA},
		DstMAC: net.HardwareAddr{0xBD, 0xBD, 0xBD, 0xBD, 0xBD, 0xBD},
	}
	tcpLayer := &layers.TCP{
		SrcPort: layers.TCPPort(80),
		DstPort: layers.TCPPort(80),
	}
	// And create the packet with the layers
	buffer := gopacket.NewSerializeBuffer()
	gopacket.SerializeLayers(buffer, gopacket.SerializeOptions{},
		ethernetLayer,
		ipLayer,
		tcpLayer,
		gopacket.Payload(message),
	)
	err = handle.WritePacketData(buffer.Bytes())
	if err != nil {
		t.Fatal(err)
	}
}

func TestNetworkInterfaceValidateConfiguration(t *testing.T) {
	type testCase struct {
		Name        string
		Cfgs        map[string]interface{}
		IsValid     bool
		ExpectedErr error
	}

	testCases := []testCase{
		{Name: "InValidType", IsValid: false, Cfgs: map[string]interface{}{"promiscuousmode": 1}, ExpectedErr: property.ErrWrongPropertyType},
		{Name: "NoSuchConfig", IsValid: false, Cfgs: map[string]interface{}{"ConfigThatDoesNotExist": true}, ExpectedErr: property.ErrNoSuchProperty},
		{Name: "MissingConfig", IsValid: false, Cfgs: nil, ExpectedErr: nil},
	}

	for _, tc := range testCases {
		rfg := NewNetworkInterfaceHandler()

		for name, prop := range tc.Cfgs {
			err := rfg.GetConfiguration().SetProperty(name, prop)
			if !errors.Is(err, tc.ExpectedErr) {
				if err != nil && tc.ExpectedErr != nil {
					t.Fatalf("%s Expected: %s, but found: %s", tc.Name, tc.ExpectedErr, err.Error())
				}

			}
		}

		valid, _ := rfg.ValidateConfiguration()
		if !tc.IsValid && valid {
			t.Fatal("Missmatch between Valid and tc.IsValid")
		}
	}

	rfg := NewNetworkInterfaceHandler()
	nethand := rfg.(*NetworkInterface)
	rfg.GetConfiguration().RemoveProperty("interface")
	valid, err := rfg.ValidateConfiguration()
	if valid {
		t.Fatal("Should not be valid without interface")
	}
	if err[0] != "Missing interface property" {
		t.Fatal("Should have detected that interface was a needed prop: ", err[0])
	}
	rfg.GetConfiguration().AddProperty("interface", "", true)
	rfg.GetConfiguration().SetProperty("interface", "nosuchinterfacae")
	valid, err = rfg.ValidateConfiguration()
	if valid || err[0] != ErrConfiguredInterface.Error() {
		t.Fatal("Should detect interfaces that does not exist")
	}

	rfg.GetConfiguration().SetProperty("bpf", "changethis")
	rfg.GetConfiguration().SetProperty("interface", "lo")
	rfg.GetConfiguration().SetProperty("promiscuousmode", "notabool")
	valid, err = rfg.ValidateConfiguration()
	if valid || (err != nil && err[0] != "the property is not of this data type") {
		t.Fatal("Wrong property on prom: ", err)
	}
	if nethand.bpf != "changethis" {
		t.Fatal("Failed to apply bpf")
	} else if nethand.netinterface == nil {
		t.Fatal("Failed to apply loopback interface")
	}
	rfg.GetConfiguration().SetProperty("snapshotlength", "strvalue")
	rfg.GetConfiguration().SetProperty("promiscuousmode", true)
	valid, err = rfg.ValidateConfiguration()
	if valid {
		if err != nil && err[0] != "the property is not of this data type" {
			t.Fatal("should detect bad property for snapshot")
		}
	}
	if nethand.prommode != true {
		t.Fatal("did not change prom mode correctly")
	}
	rfg.GetConfiguration().SetProperty("snapshotlength", 6555)
	valid, err = rfg.ValidateConfiguration()
	if !valid {
		t.Fatal("Should be valid now that all is set: ", err)
	}

	if !rfg.Subscriptionless() {
		t.Fatal("Should be subscriptionless")
	}
	if rfg.GetErrorChannel() == nil {
		t.Fatal("Should return an errorchannel")
	}
	if rfg.GetHandlerName() != "NetworkInterface" {
		t.Fatal("Wrong name provided")
	}

	rfg.SetMetricProvider(metric.NewPrometheusProvider(), "netint_test")
	if nethand.metrics == nil || nethand.metricPrefix != "netint_test" {
		t.Fatal("Failed to apply metric provider")
	}
	if nethand.MetricPayloadIn != "netint_test_payloads_in" || nethand.MetricPayloadOut != "netint_test_payloads_out" {
		t.Fatal("Wrong payload metrics name set")
	}
	if nethand.metrics.GetMetric("netint_test_payloads_in") == nil || nethand.metrics.GetMetric("netint_test_payloads_out") == nil {
		t.Fatal("Didnt create payload metrics")
	}
}
